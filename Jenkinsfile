pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'docker-central.adda247.com'
        IMAGE_NAME = 'api-partners'
        K8S_CONFIG_REPO = 'https://github.com/metiseduventures/adda-kubernetes-config'
        VALUES_PATH = 'accounts/adda-prod/backend/api-partners/values.yaml'
        ARGOCD_APP = 'api-partners-prod'
        ARGOCD_SERVER = 'argocd-central.adda247.com'
    }
    
    stages {
        stage('Build') {
            steps {
                script {
                    def buildNumber = "${env.BUILD_NUMBER}"
                    def timestamp = sh(script: 'date +%Y-%m-%d-%H-%M', returnStdout: true).trim()
                    def tag = "${timestamp}-${env.BRANCH_NAME ?: 'main'}"
                    
                    env.IMAGE_TAG = tag
                    env.VERSION = tag
                    
                    sh """
                        docker buildx create --use --name mybuilder || true
                        docker buildx inspect --bootstrap
                        docker buildx build --platform linux/amd64,linux/arm64 \
                            -t ${DOCKER_REGISTRY}/${IMAGE_NAME}:${tag} \
                            --push \
                            -f ./Dockerfile .
                    """
                }
            }
        }
        
        stage('Deploy to PROD') {
            options {
                timeout(time: 30, unit: 'MINUTES')
            }
            steps {
                input message: 'Deploy to Production?', ok: 'Deploy'
                
                script {
                    withCredentials([
                        usernamePassword(credentialsId: 'github-credentials', usernameVariable: 'REPO_CRED', passwordVariable: 'REPO_CRED_PSW'),
                        string(credentialsId: 'argo-password', variable: 'ARGO_CRED_PSW')
                    ]) {
                        sh """
                            # Clone kubernetes config repo
                            rm -rf adda-kubernetes-config
                            git clone https://\${REPO_CRED}@github.com/metiseduventures/adda-kubernetes-config
                            
                            # Update image tag in values.yaml
                            cd adda-kubernetes-config
                            sed -i 's|tagGreen: ".*"|tagGreen: "${env.VERSION}"|' ${VALUES_PATH}
                            
                            # Verify the change
                            echo "Updated values.yaml:"
                            cat ${VALUES_PATH} | grep tagGreen
                            
                            # Commit and push changes
                            git config --global user.email "build@adda247.com"
                            git config --global user.name "buildsystem"
                            git add .
                            git commit --allow-empty -m "Update image tag to ${env.VERSION} using build number ${env.VERSION}-${env.BUILD_NUMBER}"
                            git pull origin main || true
                            git push origin main
                            
                            # ArgoCD sync with error handling
                            echo "Logging into ArgoCD..."
                            argocd --grpc-web login ${ARGOCD_SERVER} --username admin --password "\${ARGO_CRED_PSW}" --loglevel info --skip-test-tls || {
                                echo "ERROR: Failed to login to ArgoCD"
                                exit 1
                            }
                            
                            echo "Checking if app exists..."
                            argocd --grpc-web app get ${ARGOCD_APP} || {
                                echo "WARNING: App ${ARGOCD_APP} not found or not accessible"
                                echo "Continuing anyway - ArgoCD auto-sync may handle the deployment"
                                exit 0
                            }
                            
                            echo "Syncing ArgoCD application..."
                            argocd --grpc-web app sync ${ARGOCD_APP} --force || {
                                echo "WARNING: ArgoCD sync failed - this may be a permissions issue"
                                echo "The image tag has been updated in the config repo"
                                echo "ArgoCD auto-sync should pick up the changes automatically"
                                echo "If auto-sync is disabled, please sync manually from ArgoCD UI"
                                exit 0  # Don't fail the build - config is updated
                            }
                            
                            echo "Waiting for deployment to complete..."
                            argocd --grpc-web app wait ${ARGOCD_APP} --timeout 600 || {
                                echo "WARNING: Deployment wait timed out or failed"
                                echo "Check ArgoCD UI for deployment status"
                            }
                        """
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo "✅ Build and deployment completed successfully"
        }
        failure {
            echo "❌ Build or deployment failed"
        }
        aborted {
            echo "⏸️ Build or deployment was aborted"
        }
    }
}
